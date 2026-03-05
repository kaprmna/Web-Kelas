import React, { useState, useEffect } from "react";
import { supabase } from "../supabase"
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";

function UploadImage() {
    //verif
  const [isSendVerif, setIsSendVerif] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null)
  const [expireTime, setExpireTime] = useState(null)
  const [isVerified, setIsVerified] = useState(false)
  const [inputCode, setInputCode] = useState("")
  
  const [imageUpload, setImageUpload] = useState(null);
  const [imageList, setImageList] = useState([]);
  const maxUploadSizeInBytes = 10 * 1024 * 1024; // 10MB
  const maxUploadsPerDay = 20;
  
  useEffect(() => {
    listImages();
  }, []);

  const listImages = async () => {
    const { data, error } = await supabase.storage
      .from("gallery")
      .list("", { limit: 100 })

    if (error) {
      console.log(error)
      return
    }

    const urls = data.map(file => {
      const { data } = supabase.storage
        .from("gallery")
        .getPublicUrl(file.name)

      return data.publicUrl
    })

    setImageList(urls)
  };

   const uploadImage = async () => {
      if (!isVerified) {
        Swal.fire({
        icon: "error",
        title: "Verification Required",
        text: "Please verify first before uploading.",
        customClass: {
            container: "sweet-alert-container",
          },
        });
        return;
    }
    if (!imageUpload) return

    const uploadedImagesCount =
      parseInt(localStorage.getItem("uploadedImagesCount")) || 0
    const lastUploadDate = localStorage.getItem("lastUploadDate")

    if (uploadedImagesCount >= maxUploadsPerDay) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You have reached the maximum uploads for today.",
        customClass: {
          container: "sweet-alert-container",
        },
      })
      return
    }

    if (
      lastUploadDate &&
      new Date(lastUploadDate).toDateString() !== new Date().toDateString()
    ) {
      localStorage.setItem("uploadedImagesCount", 0)
    }

    if (imageUpload.size > maxUploadSizeInBytes) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "The maximum size for a photo is 10MB",
        customClass: {
          container: "sweet-alert-container",
        },
      })
      return
    }

    const fileName = `${uuidv4()}-${imageUpload.name}`

    const { error } = await supabase.storage
      .from("gallery")
      .upload(fileName, imageUpload)

    if (error) {
      console.log(error)
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.message,
        customClass: {
          container: "sweet-alert-container",
        },
      })
      return
    }

    const { data } = supabase.storage
      .from("gallery")
      .getPublicUrl(fileName)

    setImageList(prev => [...prev, data.publicUrl])

    localStorage.setItem(
      "uploadedImagesCount",
      uploadedImagesCount + 1
    )
    localStorage.setItem("lastUploadDate", new Date().toISOString())

    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Your image has been successfully uploaded.",
      customClass: {
        container: "sweet-alert-container",
      },
    })

    //verif checker 
    setGeneratedCode(null);
    setIsVerified(false);
    setExpireTime(null);

    setImageUpload(null)
  }

  const handleImageChange = event => {
    setImageUpload(event.target.files[0])
  }

const getVerificationCode = async () => {
  if (isSendVerif) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: "Your code verification has sended to discord.",
      customClass: {
        container: "sweet-alert-container",
      },
    });
    return;
  }
  const code = Math.floor(1000 + Math.random() * 9000); 
  const nowUTC = new Date();
  const expireTime = new Date(
    nowUTC.getTime() + (5 * 60 * 1000)
  );

const expireTimeWITA = new Date(
  expireTime.toLocaleString("en-US", { timeZone: "Asia/Makassar" })
);

  const { data, error } = await supabase
    .from('verification_codes')
    .insert([
      { code, expires_at: expireTimeWITA.toISOString(), used: false }
    ]);

  if (error) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: error.message,
      customClass: {
        container: "sweet-alert-container",
      },
    });
    return;
  }

  const discordWebhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  if (!discordWebhookUrl) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: "Discord webhook URL is not defined.",
      customClass: {
        container: "sweet-alert-container",
      },
    });
    return;
  }

  try {
    await fetch(discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `Verification Code: **${code}**\nExpires in 3 minutes`
      })
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: "Failed to send verification code to Discord.",
      customClass: {
        container: "sweet-alert-container",
      },
    });
    return;
  }

  setIsSendVerif(true);
  setGeneratedCode(code);
  setExpireTime(expireTime);

  Swal.fire({
    icon: "success",
    title: "Code Sent!",
    text: "Verification code sent to Discord.",
    customClass: {
        container: "sweet-alert-container",
      },
  });
};

const verifyCode = async () => {
  if (!generatedCode) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: "No verification code generated.",
      customClass: {
        container: "sweet-alert-container",
      },
    });
    return;
  }

  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('code', parseInt(inputCode))
    .single();

  if (error) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: error.message,
      customClass: {
        container: "sweet-alert-container",
      },
    });
    return;
  }

  if (!data) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: "Code not found in the database.",
      customClass: {
        container: "sweet-alert-container",
      },
    });
    return;
  }

  /*if (new Date(data.expires_at) < new Date()) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: "The code has expired.",
      customClass: {
        container: "sweet-alert-container",
      },
    });
    return;
  }*/

  if (data.used) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: "The code has already been used.",
      customClass: {
        container: "sweet-alert-container",
      },
    });
    return;
  }

  const { updateError } = await supabase
    .from('verification_codes')
    .update({ used: true })
    .eq('id', data.id);

  if (updateError) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: updateError.message,
      customClass: {
        container: "sweet-alert-container",
      },
    });
    return;
  }

  setIsVerified(true);
  Swal.fire({
    icon: "success",
    title: "Verified!",
    text: "Verification successful.",
    customClass: {
        container: "sweet-alert-container",
      },//
  });
};

	return (
		<div className="flex flex-col justify-center items-center">
			<div className="text-center mb-4">
				<h1 className="text-1xl md:text-2xl md:px-10 font-bold mb-4 w-full text-white">
					Upload Your Classroom Memories
				</h1>
			</div>

			<div className="mx-auto p-4">
				<form>
					<div className="mb-4">
						<input type="file" id="imageUpload" className="hidden" onChange={handleImageChange} />
						<label
							htmlFor="imageUpload"
							className="cursor-pointer border-dashed border-2 border-gray-400 rounded-lg p-4 w-56 h-auto flex items-center justify-center">
							{imageUpload ? (
								<div className="w-full h-full overflow-hidden">
									<img
										src={URL.createObjectURL(imageUpload)}
										alt="Preview Gambar"
										className="w-full h-full object-cover"
									/>
								</div>
							) : (
								<div className="text-center px-5 py-8">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										className="h-12 w-12 mx-auto text-gray-400">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 6v6m0 0v6m0-6h6m-6 0H6"
										/>
									</svg>
									<p className="text-white opacity-60">Click to select an image</p>
								</div>
							)}
						</label>
					</div>
				</form>
			</div>

            <div className="flex flex-col items-center mt-4 gap-3">

                <input
                    type="number"
                    placeholder="Enter 4 digit code"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="px-3 py-2 rounded-md text-center"
                />

            </div>

              <button
                  onClick={isSendVerif ? verifyCode : getVerificationCode}
                  disabled={isVerified}
                  className="py-2.5 w-[60%] mb-0 md:mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
              >
                  {isVerified
                      ? "Verified ✓"
                      : isSendVerif
                      ? "Verify"
                      : "Get Verif Code"}
              </button>

			<button
				type="button"
				className="py-2.5 w-[60%] mb-0 md:mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
				onClick={uploadImage}>
				UPLOAD
			</button>
		</div>
	)
}

export default UploadImage